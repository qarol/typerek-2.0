module OwnershipGuard
  extend ActiveSupport::Concern

  private

  def verify_ownership
    unless @bet.user_id == current_user.id
      render json: {
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
          field: nil
        }
      }, status: :forbidden
    end
  end
end
