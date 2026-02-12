module Api
  module V1
    class MatchBetsController < ApplicationController
      include BetVisibilityGuard

      before_action :set_match

      def index
        after_kickoff = Time.current >= @match.kickoff_time
        bets = bets_for_match(@match, after_kickoff).to_a
        meta = { count: bets.size }

        if after_kickoff
          meta[:all_players] = User.where(activated: true).order(:nickname).pluck(:nickname)
        end

        render json: {
          data: bets.map { |bet| serialize_revealed_bet(bet) },
          meta: meta.transform_keys { |key| key.to_s.camelize(:lower) }
        }
      end

      private

      def set_match
        @match = Match.find(params[:match_id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: { code: "NOT_FOUND", message: "Match not found", field: nil }
        }, status: :not_found
      end

      def serialize_revealed_bet(bet)
        {
          id: bet.id,
          user_id: bet.user_id,
          match_id: bet.match_id,
          bet_type: bet.bet_type,
          points_earned: bet.points_earned,
          nickname: bet.user.nickname
        }.transform_keys { |key| key.to_s.camelize(:lower) }
      end
    end
  end
end
