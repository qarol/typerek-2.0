require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user with all required attributes" do
    user = User.new(nickname: "karol", password: "password123")
    assert user.valid?
  end

  test "requires nickname" do
    user = User.new(nickname: nil, password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:nickname], "can't be blank"
  end

  test "requires password" do
    user = User.new(nickname: "karol", password: "")
    assert_not user.valid?
    assert_includes user.errors[:password], "can't be blank"
  end

  test "nickname must be unique (case-insensitive)" do
    User.create!(nickname: "UniqueUser", password: "password123")
    duplicate = User.new(nickname: "uniqueuser", password: "password123")
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:nickname], "has already been taken"
  end

  test "nickname minimum length is 2" do
    user = User.new(nickname: "a", password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:nickname], "is too short (minimum is 2 characters)"
  end

  test "nickname maximum length is 30" do
    user = User.new(nickname: "a" * 31, password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:nickname], "is too long (maximum is 30 characters)"
  end

  test "has_secure_password hashes the password" do
    user = User.create!(nickname: "hashtest", password: "password123")
    assert user.password_digest.present?
    assert_not_equal "password123", user.password_digest
    assert user.authenticate("password123")
    assert_not user.authenticate("wrong")
  end

  test "admin defaults to false" do
    user = User.create!(nickname: "defaulttest", password: "password123")
    assert_equal false, user.admin
  end

  test "activated defaults to false" do
    user = User.create!(nickname: "activatetest", password: "password123")
    assert_equal false, user.activated
  end
end
