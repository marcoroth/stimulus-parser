class User::MessageComponent < ViewComponent::Base
  def initialize(name:)
    @name = name
  end
end
