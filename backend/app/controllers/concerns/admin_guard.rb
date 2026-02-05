module AdminGuard
  extend ActiveSupport::Concern

  private

  def require_admin!
    return if current_user&.admin?

    render json: {
      error: {
        code: "FORBIDDEN",
        message: "Admin access required",
        field: nil
      }
    }, status: :forbidden
  end
end
