import React from 'react'
import Layout from '../layout/Layout'
import dynamic from 'next/dynamic'

const PropertyDetails = dynamic(() => import('../property-detail/PropertyDetails'), {
    ssr: false
})

const PropertyDetailPage = () => {
    return (
        <Layout>
            <PropertyDetails />
        </Layout>
    )
}

export default PropertyDetailPage