module BetVisibilityGuard
  extend ActiveSupport::Concern

  private

  def bets_for_match(match, after_kickoff)
    if after_kickoff
      # After kickoff: reveal all bets
      match.bets.includes(:user)
    else
      # Before kickoff: only current user's bet
      match.bets.where(user: current_user).includes(:user)
    end
  end
end
