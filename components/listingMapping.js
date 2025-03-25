const listingMapping = (listing) => {
    return {
      _id: listing._id,
      title: listing.advertTitle,
      images: listing.images,
      userId: listing.userID,
      location: {
        latitude: listing.pos.coords.latitude,
        longitude: listing.pos.coords.longitude,
      },
      condition: listing.bike.bikeCondition,
      price: listing.price,
      views: listing.views.length,
      likes: listing.likes,
      brand: listing.bike.bikeBrand,
      model: listing.bike.bikeModel,
      gears: listing.bike.bikeNumberOfGears,
      description: listing.description,
      type: listing.bike.bikeType,
    };
  };

  export default listingMapping;

