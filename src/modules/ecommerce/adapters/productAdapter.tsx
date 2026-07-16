import { SvgMap } from "../constants/svgMap";

export const mapProduct = (apiData: any) => ({
  id: apiData.id,
  title: apiData.name,
  image: SvgMap[apiData.imageKey],
  discount: apiData.discount_percentage + '%',
  price: `₹${apiData.price}`,
  originalPrice: `₹${apiData.mrp}`,
  rating: apiData.rating,
  reviews: apiData.review_count,
  pointsPrice: `₹${apiData.points_price}`,
  points: apiData.points,
});
