module Api
  module V1
    class BetsController < ApplicationController
      include BetTimingGuard
      include OwnershipGuard

      before_action :set_bet, only: [:update, :destroy]
      before_action :set_match_for_create, only: [:create]
      before_action :verify_bet_timing, only: [:create, :update, :destroy]
      before_action :verify_ownership, only: [:update, :destroy]

      def index
        bets = current_user.bets
        render json: {
          data: bets.map { |bet| BetSerializer.serialize(bet) },
          meta: { count: bets.size }
        }
      end

      def create
        @bet = Bet.create!(
          user: current_user,
          match: @match,
          bet_type: params[:betType] || params[:bet_type]
        )
        render json: { data: BetSerializer.serialize(@bet) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          error: { code: "VALIDATION_ERROR", message: e.message, field: "betType" }
        }, status: :unprocessable_entity
      end

      def update
        @bet.update!(bet_type: params[:betType] || params[:bet_type])
        render json: { data: BetSerializer.serialize(@bet) }
      rescue ActiveRecord::RecordInvalid => e
        render json: {
          error: { code: "VALIDATION_ERROR", message: e.message, field: "betType" }
        }, status: :unprocessable_entity
      end

      def destroy
        @bet.destroy!
        head :no_content
      end

      private

      def set_bet
        @bet = Bet.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: { code: "NOT_FOUND", message: "Bet not found", field: nil }
        }, status: :not_found
      end

      def set_match_for_create
        @match = Match.find(params[:matchId] || params[:match_id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: { code: "NOT_FOUND", message: "Match not found", field: nil }
        }, status: :not_found
      end
    end
  end
end
