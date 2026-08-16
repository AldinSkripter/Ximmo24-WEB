import React, { useState } from 'react'
import dynamic from 'next/dynamic'
const PushNotificationLayout = dynamic(() => import('@/components/wrapper/PushNotificationLayout'), { ssr: false })
const VerticleLayout = dynamic(() => import('@/components/agent-layout/VerticleLayout'), { ssr: false })
const AgentRoot = dynamic(() => import('@/components/agent/AgentRoot'), { ssr: false })

const AgentDashboardPage = () => {
    const [notificationData, setNotificationData] = useState(null)
    const handleNotificationReceived = (data) => {
        setNotificationData(data)
    }
    return (
        <PushNotificationLayout onNotificationReceived={handleNotificationReceived}>
            <VerticleLayout>
                <AgentRoot notificationData={notificationData} />
            </VerticleLayout>
        </PushNotificationLayout>
    )
}

export default AgentDashboardPage