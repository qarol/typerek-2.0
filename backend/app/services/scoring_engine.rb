# Service object for calculating points earned on bets based on final match scores
# Deterministic pure Ruby class with no side effects beyond database writes
class ScoringEngine
  # Main entry point: calculate points for ALL bets on a match
  # Called within a transaction by the controller
  def self.calculate_all(match)
    return 0 unless match.home_score.present? && match.away_score.present?

    bets = match.bets
    bets.each do |bet|
      points = calculate_points(bet, match)
      bet.update_columns(points_earned: points)
    end
    bets.size
  end

  # Calculate points for a single bet
  def self.calculate_points(bet, match)
    return BigDecimal("0") unless bet_wins?(bet.bet_type, match.home_score, match.away_score)

    odds_for_bet_type(bet.bet_type, match) || BigDecimal("0")
  end

  # Determine if a bet type wins given the final score
  def self.bet_wins?(bet_type, home_score, away_score)
    case bet_type
    when "1"  then home_score > away_score
    when "X"  then home_score == away_score
    when "2"  then away_score > home_score
    when "1X" then home_score >= away_score  # Home win OR draw
    when "X2" then away_score >= home_score  # Draw OR away win
    when "12" then home_score != away_score  # Home win OR away win (not draw)
    else false
    end
  end

  # Get the odds value for a bet type from the match
  def self.odds_for_bet_type(bet_type, match)
    case bet_type
    when "1"  then match.odds_home
    when "X"  then match.odds_draw
    when "2"  then match.odds_away
    when "1X" then match.odds_home_draw
    when "X2" then match.odds_draw_away
    when "12" then match.odds_home_away
    end
  end
end
