class Bet < ApplicationRecord
  VALID_BET_TYPES = %w[1 X 2 1X X2 12].freeze

  belongs_to :user
  belongs_to :match

  validates :bet_type, presence: true, inclusion: { in: VALID_BET_TYPES }
  validates :user_id, uniqueness: { scope: :match_id, message: "already has a bet on this match" }
end
