import React from 'react'
import Layout from '../layout/Layout'
import Home from '../home/Home.jsx'

const HomePage = ({ initialHomepageSections, initialHomepageOtherSections, initialLanguage }) => {
    return (
        <Layout>
            <Home
                initialHomepageSections={initialHomepageSections}
                initialHomepageOtherSections={initialHomepageOtherSections}
                initialLanguage={initialLanguage}
            />
        </Layout>
    )
}

export default HomePage;
