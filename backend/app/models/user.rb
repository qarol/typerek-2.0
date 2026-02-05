class User < ApplicationRecord
  has_secure_password

  validates :nickname, presence: true,
                       uniqueness: { case_sensitive: false },
                       length: { minimum: 2, maximum: 30 }
end
