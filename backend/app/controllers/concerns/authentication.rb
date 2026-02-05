module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
  end

  def authenticate_user!
    return if current_user

    render json: { error: { code: "UNAUTHORIZED", message: "Not logged in", field: nil } }, status: :unauthorized
  end

  def logged_in?
    current_user.present?
  end
end
