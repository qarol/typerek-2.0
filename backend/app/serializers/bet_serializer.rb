class BetSerializer
  def self.serialize(bet)
    {
      id: bet.id,
      user_id: bet.user_id,
      match_id: bet.match_id,
      bet_type: bet.bet_type,
      points_earned: bet.points_earned
    }.transform_keys { |key| key.to_s.camelize(:lower) }
  end
end
