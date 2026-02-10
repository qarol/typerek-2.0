require "test_helper"

class BetTest < ActiveSupport::TestCase
  test "valid bet" do
    user = users(:player)
    match = matches(:with_odds)
    bet = Bet.new(user: user, match: match, bet_type: "1")
    assert bet.valid?
  end

  test "invalid bet_type is rejected" do
    user = users(:player)
    match = matches(:with_odds)
    bet = Bet.new(user: user, match: match, bet_type: "invalid")
    assert_not bet.valid?
    assert_includes bet.errors[:bet_type], "is not included in the list"
  end

  test "duplicate user_id and match_id raises validation error" do
    user = users(:admin)
    match = matches(:scored)
    Bet.create!(user: user, match: match, bet_type: "1")
    assert_raises(ActiveRecord::RecordInvalid) do
      Bet.create!(user: user, match: match, bet_type: "X")
    end
  end

  test "points_earned defaults to 0" do
    user = users(:admin)
    match = matches(:with_odds)
    bet = Bet.create!(user: user, match: match, bet_type: "1")
    assert_equal 0.0, bet.points_earned
  end

  test "valid bet_types are accepted" do
    user = users(:player)
    match = matches(:scored)
    valid_types = %w[1 X 2 1X X2 12]
    valid_types.each do |bet_type|
      # Create a unique user for each bet type test to avoid duplicate constraint
      new_user = User.create!(
        nickname: "testuser_#{bet_type}",
        password: "password123",
        password_confirmation: "password123"
      )
      bet = Bet.new(user: new_user, match: match, bet_type: bet_type)
      assert bet.valid?, "bet_type '#{bet_type}' should be valid"
    end
  end
end
