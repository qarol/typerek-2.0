require "test_helper"

class ScoringEngineTest < ActiveSupport::TestCase
  setup do
    @match = matches(:with_odds)
    @locked_match = matches(:locked)
    @scored_match = matches(:scored)
  end

  # ===== BET TYPE "1" (Home Win) Tests =====
  test "bet type 1 wins when home_score > away_score" do
    assert ScoringEngine.bet_wins?("1", 2, 1)
    assert ScoringEngine.bet_wins?("1", 3, 0)
    assert ScoringEngine.bet_wins?("1", 1, 0)
  end

  test "bet type 1 loses when home_score <= away_score" do
    refute ScoringEngine.bet_wins?("1", 1, 1)
    refute ScoringEngine.bet_wins?("1", 1, 2)
    refute ScoringEngine.bet_wins?("1", 0, 3)
  end

  # ===== BET TYPE "X" (Draw) Tests =====
  test "bet type X wins when home_score == away_score" do
    assert ScoringEngine.bet_wins?("X", 0, 0)
    assert ScoringEngine.bet_wins?("X", 1, 1)
    assert ScoringEngine.bet_wins?("X", 3, 3)
  end

  test "bet type X loses when home_score != away_score" do
    refute ScoringEngine.bet_wins?("X", 2, 1)
    refute ScoringEngine.bet_wins?("X", 1, 2)
    refute ScoringEngine.bet_wins?("X", 3, 0)
  end

  # ===== BET TYPE "2" (Away Win) Tests =====
  test "bet type 2 wins when away_score > home_score" do
    assert ScoringEngine.bet_wins?("2", 1, 2)
    assert ScoringEngine.bet_wins?("2", 0, 3)
    assert ScoringEngine.bet_wins?("2", 1, 2)
  end

  test "bet type 2 loses when away_score <= home_score" do
    refute ScoringEngine.bet_wins?("2", 1, 1)
    refute ScoringEngine.bet_wins?("2", 2, 1)
    refute ScoringEngine.bet_wins?("2", 3, 0)
  end

  # ===== BET TYPE "1X" (Home Win OR Draw) Tests =====
  test "bet type 1X wins when home_score > away_score (home win)" do
    assert ScoringEngine.bet_wins?("1X", 2, 1)
    assert ScoringEngine.bet_wins?("1X", 3, 0)
  end

  test "bet type 1X wins when home_score == away_score (draw)" do
    assert ScoringEngine.bet_wins?("1X", 0, 0)
    assert ScoringEngine.bet_wins?("1X", 1, 1)
    assert ScoringEngine.bet_wins?("1X", 2, 2)
  end

  test "bet type 1X loses when away_score > home_score" do
    refute ScoringEngine.bet_wins?("1X", 1, 2)
    refute ScoringEngine.bet_wins?("1X", 0, 3)
  end

  # ===== BET TYPE "X2" (Draw OR Away Win) Tests =====
  test "bet type X2 wins when away_score > home_score (away win)" do
    assert ScoringEngine.bet_wins?("X2", 1, 2)
    assert ScoringEngine.bet_wins?("X2", 0, 3)
  end

  test "bet type X2 wins when home_score == away_score (draw)" do
    assert ScoringEngine.bet_wins?("X2", 0, 0)
    assert ScoringEngine.bet_wins?("X2", 1, 1)
    assert ScoringEngine.bet_wins?("X2", 2, 2)
  end

  test "bet type X2 loses when home_score > away_score" do
    refute ScoringEngine.bet_wins?("X2", 2, 1)
    refute ScoringEngine.bet_wins?("X2", 3, 0)
  end

  # ===== BET TYPE "12" (Home Win OR Away Win) Tests =====
  test "bet type 12 wins when home_score > away_score (home win)" do
    assert ScoringEngine.bet_wins?("12", 2, 1)
    assert ScoringEngine.bet_wins?("12", 3, 0)
  end

  test "bet type 12 wins when away_score > home_score (away win)" do
    assert ScoringEngine.bet_wins?("12", 1, 2)
    assert ScoringEngine.bet_wins?("12", 0, 3)
  end

  test "bet type 12 loses when home_score == away_score (draw)" do
    refute ScoringEngine.bet_wins?("12", 0, 0)
    refute ScoringEngine.bet_wins?("12", 1, 1)
    refute ScoringEngine.bet_wins?("12", 2, 2)
  end

  # ===== Invalid Bet Type Tests =====
  test "invalid bet type always loses" do
    refute ScoringEngine.bet_wins?("invalid", 2, 1)
    refute ScoringEngine.bet_wins?("invalid", 1, 1)
    refute ScoringEngine.bet_wins?("", 2, 1)
  end

  # ===== Calculate Points Tests =====
  test "calculate_points returns 0 for losing bet" do
    bet = Bet.new(bet_type: "1")
    match = Match.new(home_score: 1, away_score: 2, odds_home: 2.5)
    points = ScoringEngine.calculate_points(bet, match)
    assert_equal BigDecimal("0"), points
  end

  test "calculate_points returns odds for winning bet" do
    bet = Bet.new(bet_type: "1")
    match = Match.new(home_score: 2, away_score: 1, odds_home: 2.5)
    points = ScoringEngine.calculate_points(bet, match)
    assert_equal BigDecimal("2.5"), points
  end

  test "calculate_points returns 0 when odds are missing" do
    bet = Bet.new(bet_type: "1")
    match = Match.new(home_score: 2, away_score: 1, odds_home: nil)
    points = ScoringEngine.calculate_points(bet, match)
    assert_equal BigDecimal("0"), points
  end

  # ===== Calculate All (Integration) Tests =====
  test "calculate_all returns 0 when match has no scores" do
    match = Match.new(home_score: nil, away_score: nil)
    count = ScoringEngine.calculate_all(match)
    assert_equal 0, count
  end

  test "calculate_all returns 0 when only home_score is present" do
    match = Match.new(home_score: 2, away_score: nil)
    count = ScoringEngine.calculate_all(match)
    assert_equal 0, count
  end

  test "calculate_all returns 0 when only away_score is present" do
    match = Match.new(home_score: nil, away_score: 1)
    count = ScoringEngine.calculate_all(match)
    assert_equal 0, count
  end

  test "calculate_all updates points for all bets on a match" do
    # Create match with scores and odds
    match = matches(:with_odds)
    match.update!(home_score: 2, away_score: 1)

    # Create bets on the match
    user1 = User.create!(nickname: "user_calc_1", password: "password123", password_confirmation: "password123", admin: false)
    user2 = User.create!(nickname: "user_calc_2", password: "password123", password_confirmation: "password123", admin: false)

    bet1 = Bet.create!(
      user: user1,
      match: match,
      bet_type: "1",
      points_earned: 0
    )
    bet2 = Bet.create!(
      user: user2,
      match: match,
      bet_type: "2",
      points_earned: 0
    )

    # Calculate points
    count = ScoringEngine.calculate_all(match)

    # Verify count
    assert_equal 2, count

    # Verify points were updated
    bet1.reload
    bet2.reload
    assert_equal match.odds_home, bet1.points_earned  # Bet "1" wins
    assert_equal BigDecimal("0"), bet2.points_earned  # Bet "2" loses
  end

  test "calculate_all awards 0 points for incorrect bets" do
    match = matches(:with_odds)
    match.update!(home_score: 2, away_score: 1)

    user = User.create!(nickname: "user_incorrect_bet", password: "password123", password_confirmation: "password123", admin: false)
    bet = Bet.create!(
      user: user,
      match: match,
      bet_type: "2",  # Away win
      points_earned: 0
    )

    ScoringEngine.calculate_all(match)

    bet.reload
    assert_equal BigDecimal("0"), bet.points_earned
  end

  test "calculate_all is deterministic" do
    match = matches(:with_odds)
    match.update!(home_score: 2, away_score: 1)

    bet = Bet.create!(
      user: users(:player),
      match: match,
      bet_type: "1",
      points_earned: 0
    )

    # Calculate twice
    ScoringEngine.calculate_all(match)
    first_result = bet.reload.points_earned

    bet.update!(points_earned: 0)
    ScoringEngine.calculate_all(match)
    second_result = bet.reload.points_earned

    # Results should be identical
    assert_equal first_result, second_result
  end

  test "calculate_all works with compound bets" do
    match = matches(:with_odds)
    match.update!(home_score: 2, away_score: 1)

    user1 = User.create!(nickname: "user_compound_1", password: "password123", password_confirmation: "password123", admin: false)
    user2 = User.create!(nickname: "user_compound_2", password: "password123", password_confirmation: "password123", admin: false)

    bet_1x = Bet.create!(
      user: user1,
      match: match,
      bet_type: "1X",
      points_earned: 0
    )

    bet_x2 = Bet.create!(
      user: user2,
      match: match,
      bet_type: "X2",
      points_earned: 0
    )

    ScoringEngine.calculate_all(match)

    bet_1x.reload
    bet_x2.reload
    assert_equal match.odds_home_draw, bet_1x.points_earned  # "1X" wins (home win)
    assert_equal BigDecimal("0"), bet_x2.points_earned  # "X2" loses
  end

  test "calculate_all handles draws correctly" do
    match = matches(:with_odds)
    match.update!(home_score: 1, away_score: 1)

    user1 = User.create!(nickname: "user_draw_1", password: "password123", password_confirmation: "password123", admin: false)
    user2 = User.create!(nickname: "user_draw_2", password: "password123", password_confirmation: "password123", admin: false)
    user3 = User.create!(nickname: "user_draw_3", password: "password123", password_confirmation: "password123", admin: false)

    bet_x = Bet.create!(
      user: user1,
      match: match,
      bet_type: "X",
      points_earned: 0
    )

    bet_1x = Bet.create!(
      user: user2,
      match: match,
      bet_type: "1X",
      points_earned: 0
    )

    bet_x2 = Bet.create!(
      user: user3,
      match: match,
      bet_type: "X2",
      points_earned: 0
    )

    ScoringEngine.calculate_all(match)

    bet_x.reload
    bet_1x.reload
    bet_x2.reload
    assert_equal match.odds_draw, bet_x.points_earned  # "X" wins
    assert_equal match.odds_home_draw, bet_1x.points_earned  # "1X" wins
    assert_equal match.odds_draw_away, bet_x2.points_earned  # "X2" wins
  end
end
