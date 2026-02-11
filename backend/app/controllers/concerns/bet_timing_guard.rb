module BetTimingGuard
  extend ActiveSupport::Concern

  private

  def verify_bet_timing
    match = @bet ? @bet.match : Match.find(params[:matchId] || params[:match_id])

    if Time.current >= match.kickoff_time
      render json: {
        error: {
          code: "BET_LOCKED",
          message: "Match has started",
          field: nil
        }
      }, status: :forbidden
    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      error: {
        code: "NOT_FOUND",
        message: "Record not found",
        field: nil
      }
    }, status: :not_found
  end
end
