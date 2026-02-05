require "test_helper"

class UserInviteTokenTest < ActiveSupport::TestCase
  test "generates invite token for new user" do
    user = User.create!(nickname: "newbie", activated: false)
    token = user.generate_token_for(:invite)

    assert_not_nil token
    assert token.length > 20
  end

  test "find_by_token_for returns user with valid token" do
    user = User.create!(nickname: "invitee", activated: false)
    token = user.generate_token_for(:invite)

    found_user = User.find_by_token_for(:invite, token)
    assert_equal user.id, found_user.id
  end

  test "token expires after 72 hours" do
    user = User.create!(nickname: "expiretest", activated: false)
    token = user.generate_token_for(:invite)

    # Simulate time passing
    travel 73.hours do
      found_user = User.find_by_token_for(:invite, token)
      assert_nil found_user
    end
  end

  test "token invalidated when user activates" do
    user = User.create!(nickname: "activation_test", activated: false)
    token = user.generate_token_for(:invite)

    # Verify token works before activation
    assert_not_nil User.find_by_token_for(:invite, token)

    # Activate user
    user.update!(activated: true, password: "password123", password_confirmation: "password123")

    # Token should now be invalid
    assert_nil User.find_by_token_for(:invite, token)
  end

  test "generate_invite_url returns full URL with token" do
    user = User.create!(nickname: "urltest", activated: false)
    base_url = "http://localhost:5173"

    invite_url = user.generate_invite_url(base_url)

    assert invite_url.start_with?("#{base_url}/activate?token=")
    assert invite_url.include?("token=")

    # Extract and verify token works
    token = invite_url.split("token=").last
    found_user = User.find_by_token_for(:invite, token)
    assert_equal user.id, found_user.id
  end

  test "password must be at least 6 characters" do
    user = User.new(nickname: "shortpass", password: "12345", password_confirmation: "12345")

    assert_not user.valid?
    assert_includes user.errors[:password], "is too short (minimum is 6 characters)"
  end

  test "password validation allows nil for existing users" do
    user = User.create!(nickname: "nopassyet", activated: false)

    assert user.valid?
    assert_nil user.password_digest
  end

  test "password confirmation must match" do
    user = User.new(nickname: "mismatch", password: "password123", password_confirmation: "different")

    assert_not user.valid?
    assert_includes user.errors[:password_confirmation], "doesn't match Password"
  end
end
