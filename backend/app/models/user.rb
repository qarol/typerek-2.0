class User < ApplicationRecord
  has_secure_password validations: false
  has_many :bets, dependent: :destroy

  validates :nickname, presence: true,
                       uniqueness: { case_sensitive: false },
                       length: { minimum: 2, maximum: 30 }
  validates :password, length: { minimum: 6 }, allow_nil: true, if: -> { password.present? }
  validates :password, confirmation: true, if: -> { password.present? }
  validates :password_confirmation, presence: true, if: -> { password.present? }

  # Generate invite tokens that expire in 72 hours and invalidate when user activates
  generates_token_for :invite, expires_in: 72.hours do
    # Token invalidated when activated changes (when user activates their account)
    activated
  end

  # Generate full invite URL with token
  def generate_invite_url(base_url)
    "#{base_url}/activate?token=#{generate_token_for(:invite)}"
  end
end
