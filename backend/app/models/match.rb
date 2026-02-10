class Match < ApplicationRecord
  validates :home_team, presence: true
  validates :away_team, presence: true
  validates :kickoff_time, presence: true
  validates :home_score, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :away_score, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :odds_home, numericality: { greater_than: 1.00, less_than: 100 }, allow_nil: true
  validates :odds_draw, numericality: { greater_than: 1.00, less_than: 100 }, allow_nil: true
  validates :odds_away, numericality: { greater_than: 1.00, less_than: 100 }, allow_nil: true
  validates :odds_home_draw, numericality: { greater_than: 1.00, less_than: 100 }, allow_nil: true
  validates :odds_draw_away, numericality: { greater_than: 1.00, less_than: 100 }, allow_nil: true
  validates :odds_home_away, numericality: { greater_than: 1.00, less_than: 100 }, allow_nil: true

  # has_many :bets, dependent: :restrict_with_error  # Added in Story 3.1
end
