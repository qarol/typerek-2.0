module Api
  module V1
    module Admin
      class MatchesController < ApplicationController
        include AdminGuard

        before_action :require_admin!
        before_action :set_match

        def update
          if @match.update(odds_params)
            render json: { data: MatchSerializer.serialize(@match) }
          else
            # Return first validation error with field name
            field = @match.errors.attribute_names.first
            render json: {
              error: {
                code: "VALIDATION_ERROR",
                message: @match.errors.full_messages.first,
                field: field.to_s.camelize(:lower)
              }
            }, status: :unprocessable_entity
          end
        end

        private

        def set_match
          @match = Match.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: {
            error: { code: "NOT_FOUND", message: "Match not found", field: nil }
          }, status: :not_found
        end

        def odds_params
          # Accept both camelCase and snake_case
          params.permit(
            :odds_home, :odds_draw, :odds_away,
            :odds_home_draw, :odds_draw_away, :odds_home_away,
            :oddsHome, :oddsDraw, :oddsAway,
            :oddsHomeDraw, :oddsDrawAway, :oddsHomeAway
          ).then { |p| normalize_odds_params(p) }
        end

        def normalize_odds_params(permitted)
          {
            odds_home: permitted[:oddsHome] || permitted[:odds_home],
            odds_draw: permitted[:oddsDraw] || permitted[:odds_draw],
            odds_away: permitted[:oddsAway] || permitted[:odds_away],
            odds_home_draw: permitted[:oddsHomeDraw] || permitted[:odds_home_draw],
            odds_draw_away: permitted[:oddsDrawAway] || permitted[:odds_draw_away],
            odds_home_away: permitted[:oddsHomeAway] || permitted[:odds_home_away]
          }.compact
        end
      end
    end
  end
end
