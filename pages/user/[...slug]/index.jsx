import MetaData from "@/components/meta/MetaData"
import UserDashboardPage from "@/components/pagescomponents/UserDashboardPage"
const page = () => {

    return (
        <>
            <MetaData
                title={process.env.NEXT_PUBLIC_META_TITLE}
                description={process.env.NEXT_PUBLIC_META_DESCRIPTION}
                keywords={process.env.NEXT_PUBLIC_META_KEYWORD}
                pageName={'user-dashboard'}
            />
            <UserDashboardPage />
        </>
    )
}

export default page