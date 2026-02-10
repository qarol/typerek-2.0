module Api
  module V1
    class MatchesController < ApplicationController
      def index
        matches = Match.order(kickoff_time: :asc)
        render json: {
          data: matches.map { |match| MatchSerializer.serialize(match) },
          meta: { count: matches.size }
        }
      end
    end
  end
end
