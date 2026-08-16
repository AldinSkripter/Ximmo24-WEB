import FeaturedPropertyHorizontalCard from './FeaturedPropertyHorizontalCard';

const AnimatedFeaturedCard = ({ properties }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {properties.map((property) => (
                <FeaturedPropertyHorizontalCard key={property?.id} property={property} />
            ))}
        </div>
    );
};

export default AnimatedFeaturedCard;
