class LeaderboardSerializer
  def self.serialize(entry)
    {
      position: entry[:position],
      user_id: entry[:user_id],
      nickname: entry[:nickname],
      total_points: entry[:total_points],
      previous_position: entry[:previous_position]
    }.transform_keys { |key| key.to_s.camelize(:lower) }
  end
end
