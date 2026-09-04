"use client"
import { useRouter } from 'next/router'
import AgentAdvertisement from './AgentAdvertisement'
import AgentProjects from './AgentProjects'
import AgentChat from './AgentChat'
import AgentProfile from './AgentProfile'
import AgentNotifications from './AgentNotifications'
import AgentSubscription from './AgentSubscription'
import AgentTransactionHistory from './AgentTransactionHistory'
import AgentVerificationForm from './AgentVerificationForm'
import AddProperty from './property/AddProperty'
import EditProperty from './property/EditProperty'
import AddProject from './project/AddProject'
import EditProject from './project/EditProject'
import InterestedUsersTable from './InterestedUsersTable'
import AgentAppointmentConfiguration from './AgentAppointmentConfiguration'
import NewAgentDashboard from './NewAgentDashboard'
import AgentAppointmentBookings from './AgentAppointmentBookings'
import AgentProperties from './AgentProperties'
import AgentPackages from './AgentPackages'
import AgentWatermarkSettings from './AgentWatermarkSettings'
import AgentStories from './AgentStories'
import AgentOpenImmoImport from './AgentOpenImmoImport'

// Root component to render the agent dashboard related pages
const AgentRoot = ({ notificationData }) => {
    const router = useRouter()
    const { slug = [] } = router.query;

    // Convert slug to array if it's not already
    const slugArray = Array.isArray(slug) ? slug : [slug];

    // Get the main section from the first part of the slug
    const mainSection = slugArray[0];

    // For dynamic routes like edit-property/[propertySlug]
    // we pass the additional parameters to the component
    const params = slugArray.slice(1);


    // Component mapping object for more efficient routing
    const componentMap = {
        "dashboard": NewAgentDashboard,
        "advertisement": AgentAdvertisement,
        "properties": AgentProperties,
        "projects": AgentProjects,
        "chat": AgentChat,
        "profile": AgentProfile,
        "notifications": AgentNotifications,
        "subscription": AgentSubscription,
        "transaction-history": AgentTransactionHistory,
        "verification-form": AgentVerificationForm,
        "add-property": AddProperty,
        "edit-property": EditProperty,
        "add-project": AddProject,
        "edit-project": EditProject,
        "interested": InterestedUsersTable,
        "bookings": AgentAppointmentBookings,
        "appointment-settings": AgentAppointmentConfiguration,
        "packages": AgentPackages,
        "watermark-settings": AgentWatermarkSettings,
        "stories": AgentStories,
        "import-schnittstellen": AgentOpenImmoImport

    }

    // Get the Component to render based on the main section
    const Component = componentMap[mainSection]

    // Return the component if it exists with any additional params
    // This allows us to pass propertySlug to EditProperty component
    return Component ? <Component params={params} notificationData={notificationData} /> : null
}

export default AgentRoot