require "test_helper"

class MatchTest < ActiveSupport::TestCase
  test "valid match with all required fields" do
    match = Match.new(home_team: "USA", away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0))
    assert match.valid?
  end

  test "valid match with all fields" do
    match = Match.new(
      home_team: "USA",
      away_team: "Mexico",
      kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0),
      group_label: "Group B",
      home_score: 2,
      away_score: 1,
      odds_home: 2.10,
      odds_draw: 3.45,
      odds_away: 4.00,
      odds_home_draw: 1.25,
      odds_draw_away: 1.80,
      odds_home_away: 1.50
    )
    assert match.valid?
  end

  test "requires home_team" do
    match = Match.new(home_team: nil, away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0))
    assert_not match.valid?
    assert_includes match.errors[:home_team], "can't be blank"
  end

  test "requires away_team" do
    match = Match.new(home_team: "USA", away_team: nil, kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0))
    assert_not match.valid?
    assert_includes match.errors[:away_team], "can't be blank"
  end

  test "requires kickoff_time" do
    match = Match.new(home_team: "USA", away_team: "Mexico", kickoff_time: nil)
    assert_not match.valid?
    assert_includes match.errors[:kickoff_time], "can't be blank"
  end

  test "optional fields accept nil" do
    match = Match.new(
      home_team: "USA",
      away_team: "Mexico",
      kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0),
      group_label: nil,
      home_score: nil,
      away_score: nil,
      odds_home: nil,
      odds_draw: nil,
      odds_away: nil,
      odds_home_draw: nil,
      odds_draw_away: nil,
      odds_home_away: nil
    )
    assert match.valid?
  end

  test "scores must be >= 0 when present" do
    match = Match.new(home_team: "USA", away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0), home_score: -1)
    assert_not match.valid?
    assert_includes match.errors[:home_score], "must be greater than or equal to 0"

    match.home_score = 0
    match.away_score = -1
    assert_not match.valid?
    assert_includes match.errors[:away_score], "must be greater than or equal to 0"
  end

  test "scores must be integers" do
    match = Match.new(home_team: "USA", away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0), home_score: 1.5)
    assert_not match.valid?
    assert_includes match.errors[:home_score], "must be an integer"
  end

  test "odds must be > 1.00 when present" do
    match = Match.new(home_team: "USA", away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0), odds_home: 1.00)
    assert_not match.valid?
    assert_includes match.errors[:odds_home], "must be greater than 1.0"

    match.odds_home = 0.50
    assert_not match.valid?
    assert_includes match.errors[:odds_home], "must be greater than 1.0"
  end

  test "all odds fields validate > 1.00" do
    base_attrs = { home_team: "USA", away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0) }
    odds_fields = %i[odds_home odds_draw odds_away odds_home_draw odds_draw_away odds_home_away]

    odds_fields.each do |field|
      match = Match.new(base_attrs.merge(field => 0.99))
      assert_not match.valid?, "Expected #{field} = 0.99 to be invalid"
      assert match.errors[field].present?, "Expected error on #{field}"
    end
  end

  test "all odds fields validate < 100 (decimal 4,2 constraint)" do
    base_attrs = { home_team: "USA", away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0) }
    odds_fields = %i[odds_home odds_draw odds_away odds_home_draw odds_draw_away odds_home_away]

    odds_fields.each do |field|
      match = Match.new(base_attrs.merge(field => 100.00))
      assert_not match.valid?, "Expected #{field} = 100.00 to be invalid"
      assert match.errors[field].present?, "Expected error on #{field}"
    end
  end

  test "all odds fields accept valid values between 1.01 and 99.99" do
    base_attrs = { home_team: "USA", away_team: "Mexico", kickoff_time: Time.utc(2026, 6, 12, 18, 0, 0) }
    odds_fields = %i[odds_home odds_draw odds_away odds_home_draw odds_draw_away odds_home_away]

    odds_fields.each do |field|
      match = Match.new(base_attrs.merge(field => 50.00))
      assert match.valid?, "Expected #{field} = 50.00 to be valid"
    end
  end
end
