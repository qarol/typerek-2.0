module BetVisibilityGuard
  extend ActiveSupport::Concern

  private

  def bets_for_match(match)
    if Time.current >= match.kickoff_time
      # After kickoff: reveal all bets
      match.bets.includes(:user)
    else
      # Before kickoff: only current user's bet
      match.bets.where(user: current_user)
    end
  end
end
