import BecomeAgentForm from '../become-agent/BecomeAgentForm'
import BecomeAgentFooter from '../become-agent/BecomeAgentFooter'

const BecomeAgentFormPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <main className="flex-grow">
                <BecomeAgentForm />
            </main>
            <BecomeAgentFooter />
        </div>
    )
}

export default BecomeAgentFormPage
