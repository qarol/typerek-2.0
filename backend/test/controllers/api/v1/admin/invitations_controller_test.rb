require "test_helper"

class Api::V1::Admin::InvitationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin_user = users(:admin)
    @regular_user = users(:player)
  end

  # AdminGuard tests
  test "admin user can create invitation" do
    # Login as admin
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }
    assert_response :success

    # Create invitation
    assert_difference("User.count", 1) do
      post api_v1_admin_invitations_url, params: { nickname: "InvitedFriend" }
    end

    assert_response :success
    json = JSON.parse(@response.body)

    assert_equal "InvitedFriend", json["data"]["nickname"]
    assert json["data"]["inviteUrl"].include?("/activate?token=")
    assert_not_nil json["data"]["id"]

    # Verify user created correctly
    user = User.find(json["data"]["id"])
    assert_equal false, user.activated
    assert_nil user.password_digest
  end

  test "non-admin user receives 403 forbidden" do
    # Login as regular user
    post api_v1_sessions_url, params: { nickname: "tomek", password: "secret123" }
    assert_response :success

    # Attempt to create invitation
    assert_no_difference("User.count") do
      post api_v1_admin_invitations_url, params: { nickname: "UniqueFriend" }
    end

    assert_response :forbidden
    json = JSON.parse(@response.body)
    assert_equal "FORBIDDEN", json["error"]["code"]
    assert_equal "Admin access required", json["error"]["message"]
  end

  test "unauthenticated user receives 401 unauthorized" do
    assert_no_difference("User.count") do
      post api_v1_admin_invitations_url, params: { nickname: "UniqueFriend" }
    end

    assert_response :unauthorized
    json = JSON.parse(@response.body)
    assert_equal "UNAUTHORIZED", json["error"]["code"]
  end

  # Invitation creation tests
  test "duplicate nickname returns 422 validation error" do
    # Login as admin
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }
    assert_response :success

    # Try to create user with existing nickname
    assert_no_difference("User.count") do
      post api_v1_admin_invitations_url, params: { nickname: "tomek" }
    end

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "VALIDATION_ERROR", json["error"]["code"]
    assert_equal "Nickname already taken", json["error"]["message"]
    assert_equal "nickname", json["error"]["field"]
  end

  test "empty nickname returns validation error" do
    # Login as admin
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }
    assert_response :success

    # Try to create user with empty nickname
    assert_no_difference("User.count") do
      post api_v1_admin_invitations_url, params: { nickname: "" }
    end

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "VALIDATION_ERROR", json["error"]["code"]
    assert json["error"]["message"].include?("Nickname")
  end

  test "missing nickname returns validation error" do
    # Login as admin
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }
    assert_response :success

    # Try to create user without nickname
    assert_no_difference("User.count") do
      post api_v1_admin_invitations_url, params: {}
    end

    assert_response :unprocessable_entity
    json = JSON.parse(@response.body)
    assert_equal "VALIDATION_ERROR", json["error"]["code"]
  end

  test "invite URL includes token that can be used to find user" do
    # Login as admin
    post api_v1_sessions_url, params: { nickname: "admin", password: "secret123" }
    assert_response :success

    # Create invitation
    post api_v1_admin_invitations_url, params: { nickname: "TokenTest" }
    assert_response :success

    json = JSON.parse(@response.body)
    invite_url = json["data"]["inviteUrl"]

    # Extract token from URL
    token = invite_url.split("token=").last

    # Verify token can find user
    user = User.find_by_token_for(:invite, token)
    assert_not_nil user
    assert_equal "TokenTest", user.nickname
  end
end
