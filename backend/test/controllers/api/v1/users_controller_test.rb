require "test_helper"

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @inactive_user = users(:inactive)
  end

  # --- verify_token tests ---

  test "verify_token with valid token returns nickname" do
    token = @inactive_user.generate_token_for(:invite)

    get verify_token_api_v1_users_url, params: { token: token }

    assert_response :success
    json = JSON.parse(@response.body)
    assert_equal "newuser", json["data"]["nickname"]
  end

  test "verify_token with invalid token returns 422" do
    get verify_token_api_v1_users_url, params: { token: "invalid-token" }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end

  test "verify_token with expired token returns 422" do
    token = @inactive_user.generate_token_for(:invite)

    travel 73.hours do
      get verify_token_api_v1_users_url, params: { token: token }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)
      assert_equal "INVALID_TOKEN", json["error"]["code"]
    end
  end

  test "verify_token with already-activated user returns ALREADY_ACTIVATED" do
    activated_user = users(:admin)
    token = activated_user.generate_token_for(:invite)

    get verify_token_api_v1_users_url, params: { token: token }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "ALREADY_ACTIVATED", json["error"]["code"]
  end

  test "verify_token with missing token returns 422" do
    get verify_token_api_v1_users_url

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end

  # --- activate tests ---

  test "activate with valid token, password sets password, activates user, creates session" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }

    assert_response :success
    json = JSON.parse(@response.body)

    # Verify response data
    assert_equal @inactive_user.id, json["data"]["id"]
    assert_equal "newuser", json["data"]["nickname"]

    # Verify user was activated
    @inactive_user.reload
    assert @inactive_user.activated
    assert @inactive_user.authenticate("newpassword123")

    # Verify session was created (user auto-logged in)
    assert_not_nil session[:user_id]
    assert_equal @inactive_user.id, session[:user_id]
  end

  test "activate with expired token returns 422 with INVALID_TOKEN" do
    token = @inactive_user.generate_token_for(:invite)

    # Simulate token expiry
    travel 73.hours do
      post activate_api_v1_users_url, params: {
        token: token,
        password: "newpassword123",
        passwordConfirmation: "newpassword123"
      }

      assert_response :unprocessable_entity
      json = JSON.parse(@response.body)

      assert_equal "INVALID_TOKEN", json["error"]["code"]
      assert_equal "Invalid or expired invite link. Contact your group admin.", json["error"]["message"]
      assert_equal "token", json["error"]["field"]

      # Verify user not activated
      @inactive_user.reload
      assert_not @inactive_user.activated
    end
  end

  test "activate with invalid token returns 422 with INVALID_TOKEN" do
    post activate_api_v1_users_url, params: {
      token: "invalid-token-xyz",
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "INVALID_TOKEN", json["error"]["code"]
    assert_equal "Invalid or expired invite link. Contact your group admin.", json["error"]["message"]
    assert_equal "token", json["error"]["field"]
  end

  test "activate with already-activated user returns 422 with ALREADY_ACTIVATED" do
    activated_user = users(:admin)
    token = activated_user.generate_token_for(:invite)

    # Token is immediately invalid because user is already activated
    post activate_api_v1_users_url, params: {
      token: token,
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "ALREADY_ACTIVATED", json["error"]["code"]
    assert_equal "Account already activated", json["error"]["message"]
    assert_equal "token", json["error"]["field"]
  end

  test "activate with password too short returns validation error" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      password: "short",
      passwordConfirmation: "short"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "VALIDATION_ERROR", json["error"]["code"]
    assert json["error"]["message"].include?("Password")
    assert json["error"]["message"].include?("too short")
  end

  test "activate with password confirmation mismatch returns validation error" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      password: "password123",
      passwordConfirmation: "different123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "VALIDATION_ERROR", json["error"]["code"]
    assert json["error"]["message"].include?("Password confirmation")
  end

  test "activate with missing password returns validation error" do
    token = @inactive_user.generate_token_for(:invite)

    post activate_api_v1_users_url, params: {
      token: token,
      passwordConfirmation: "password123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "VALIDATION_ERROR", json["error"]["code"]
  end

  test "activate with missing token returns validation error" do
    post activate_api_v1_users_url, params: {
      password: "password123",
      passwordConfirmation: "password123"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end

  test "token is single-use - second activation attempt fails" do
    token = @inactive_user.generate_token_for(:invite)

    # First activation succeeds
    post activate_api_v1_users_url, params: {
      token: token,
      password: "newpassword123",
      passwordConfirmation: "newpassword123"
    }
    assert_response :success

    # Second activation with same token fails (token becomes invalid when user activates)
    post activate_api_v1_users_url, params: {
      token: token,
      password: "anotherpassword",
      passwordConfirmation: "anotherpassword"
    }

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)

    # Token is invalidated when activated changes, so we get INVALID_TOKEN
    assert_equal "INVALID_TOKEN", json["error"]["code"]
  end
end
