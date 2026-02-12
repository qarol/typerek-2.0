module Api
  module V1
    class LeaderboardController < ApplicationController
      def index
        # Query all activated users with their total points
        users_with_points = User
          .where(activated: true)
          .left_joins(:bets)
          .group('users.id', 'users.nickname', 'users.previous_rank')
          .select(
            'users.id',
            'users.nickname',
            'users.previous_rank',
            'COALESCE(SUM(bets.points_earned), 0.0) AS total_points'
          )
          .order('total_points DESC, users.nickname ASC')

        # Apply standard competition ranking (1, 2, 2, 4 — positions skipped after ties)
        standings = []
        users_with_points.each_with_index do |user, index|
          position = if index > 0 && user.total_points.to_f == users_with_points[index - 1].total_points.to_f
            standings.last[:position]
          else
            index + 1
          end
          standings << {
            position: position,
            user_id: user.id,
            nickname: user.nickname,
            total_points: user.total_points.to_f,
            previous_position: user.previous_rank
          }
        end

        render json: {
          data: standings.map { |s| LeaderboardSerializer.serialize(s) },
          meta: { count: standings.size }
        }
      end
    end
  end
end
