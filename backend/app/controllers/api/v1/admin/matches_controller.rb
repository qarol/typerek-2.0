module Api
  module V1
    module Admin
      class MatchesController < ApplicationController
        include AdminGuard

        before_action :require_admin!
        before_action :set_match

        def update
          odds = odds_params
          if odds.any? && @match.kickoff_time <= Time.current
            render json: {
              error: { code: "MATCH_STARTED", message: "Cannot modify odds after match has started", field: nil }
            }, status: :unprocessable_entity
            return
          end

          combined = odds.merge(match_details_params)
          if @match.update(combined)
            render json: { data: MatchSerializer.serialize(@match) }
          else
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

        def score
          if @match.kickoff_time > Time.current
            render json: {
              error: { code: "SCORE_BEFORE_KICKOFF", message: "Cannot enter results before the match starts", field: nil }
            }, status: :unprocessable_entity
            return
          end

          home_score = score_params[:home_score]
          away_score = score_params[:away_score]

          if home_score.nil? || away_score.nil?
            render json: {
              error: { code: "VALIDATION_ERROR", message: "Both scores are required", field: nil }
            }, status: :unprocessable_entity
            return
          end

          is_rescoring = @match.home_score.present? && @match.away_score.present?
          player_count = 0
          ActiveRecord::Base.transaction do
            @match.update!(home_score: home_score, away_score: away_score)

            unless is_rescoring
              # Capture current leaderboard positions as previous_rank for movement indicators
              ranked_users = User.where(activated: true)
                  .left_joins(:bets)
                  .group("users.id", "users.nickname")
                  .select("users.id", "COALESCE(SUM(bets.points_earned), 0.0) AS total_points")
                  .order("total_points DESC, users.nickname ASC")

              ranked_users_arr = ranked_users.to_a
              positions = []
              ranked_users_arr.each_with_index do |user, index|
                position = if index > 0 && user.total_points.to_f == ranked_users_arr[index - 1].total_points.to_f
                  positions[index - 1]
                else
                  index + 1
                end
                positions << position
                User.where(id: user.id).update_all(previous_rank: position)
              end
            end

            @match.bets.update_all(points_earned: 0) if is_rescoring
            player_count = ScoringEngine.calculate_all(@match)
          end

          render json: {
            data: MatchSerializer.serialize(@match.reload),
            meta: { playersScored: player_count }
          }
        rescue ActiveRecord::RecordInvalid => e
          render json: {
            error: { code: "VALIDATION_ERROR", message: e.message, field: nil }
          }, status: :unprocessable_entity
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

        def match_details_params
          params.permit(
            :home_team, :away_team, :kickoff_time,
            :homeTeam, :awayTeam, :kickoffTime
          ).then do |p|
            {
              home_team: p[:homeTeam] || p[:home_team],
              away_team: p[:awayTeam] || p[:away_team],
              kickoff_time: p[:kickoffTime] || p[:kickoff_time]
            }.compact
          end
        end

        def score_params
          # Accept both camelCase and snake_case
          home = params[:homeScore] || params[:home_score]
          away = params[:awayScore] || params[:away_score]

          # Convert to integers, but keep nil if param was absent
          home_score = home.nil? ? nil : Integer(home)
          away_score = away.nil? ? nil : Integer(away)

          { home_score: home_score, away_score: away_score }
        rescue ArgumentError
          # If conversion to Integer fails, return nil (will trigger validation error)
          { home_score: nil, away_score: nil }
        end
      end
    end
  end
end
