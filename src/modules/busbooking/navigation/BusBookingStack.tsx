import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingHomeScreen from "../components/screens/BookingHomeScreen";
import BusListingScreen from "../components/screens/BusListingScreen";
import AllFilterScreen from "../components/screens/AllFilterScreen";
import AboutBusScreen from "../components/screens/AboutBusScreen";
import SeatSelectionScreen from "../components/screens/SeatSelectionScreen";
import PassengerDetailsScreen from "../components/screens/PassengerDetailsScreen";
import BoardingDroppingSelectionScreen from "../components/screens/BoardingDroppingSelectionScreen";
import BusSummaryScreen from "../components/screens/BusSummaryScreen";
import PaymentScreen from "../components/screens/PaymentScreen";

export type BusBookingStackParamList = {
  BookingHomeScreen: undefined;
  BusListingScreen: {
  buses: any[];
  emptyStateMessage?: string;

  traceId?: string | number | null;

  sourceCity: string;

  destinationCity: string;

  sourceCityCode: string;

  destinationCityCode: string;

  journeyDate: string;

  journeyTime: string;

  isWomenBooking?: boolean;

  selectedFilters?: string[];
};
  AllFilterScreen: {
    selectedOptions?: string[];
  } | undefined;
  AboutBusScreen: { bus: any };
  SeatSelectionScreen: {
  bus: any;
  seatLayout: any;
  isWomenBooking?: boolean;
};
PassengerDetailsScreen: {
  bus: any;

  selectedSeats: any[];

  boardingPoint?: any;

  droppingPoint?: any;

  traceId?: string;

  srdvIndex?: string;

  resultIndex?: string;

  isWomenBooking?: boolean;
};
BoardingDroppingSelectionScreen: {
  bus: any;

  selectedSeats: any[];

  passengers?: any[];

  traceId?: string;

  srdvIndex?: string;

  resultIndex?: string;

  isWomenBooking?: boolean;
};
BusSummaryScreen: {
  bus: any;
  selectedSeats: any[];
  passengers: any[];
  boardingPoint: any;
  droppingPoint: any;
  blockResponse: any;
};


PaymentScreen: {
  bus: any;
  selectedSeats: any[];
  passengers?: any[];
  totalAmount: number;
  boardingPoint: any;
  droppingPoint: any;
  blockResponse: any;
};
};

const Stack = createNativeStackNavigator<BusBookingStackParamList>();

export default function BusBookingStack() {
  return (
    <Stack.Navigator
      initialRouteName="BookingHomeScreen"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="BookingHomeScreen" component={BookingHomeScreen} />
      <Stack.Screen name="BusListingScreen" component={BusListingScreen} />
      <Stack.Screen name="AllFilterScreen" component={AllFilterScreen} />
      <Stack.Screen name="AboutBusScreen" component={AboutBusScreen} />
      <Stack.Screen name="SeatSelectionScreen" component={SeatSelectionScreen} />
      <Stack.Screen
        name="PassengerDetailsScreen"
        component={PassengerDetailsScreen}
      />
      <Stack.Screen
        name="BoardingDroppingSelectionScreen"
        component={BoardingDroppingSelectionScreen}
      />
      <Stack.Screen name="BusSummaryScreen" component={BusSummaryScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
    </Stack.Navigator>
  );
}
