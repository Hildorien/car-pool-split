"use client"
import React, { useState } from 'react';
export default function CarPoolForm() {
    const [addresses, setAddresses] = useState(['']);
    const [loading, setLoading] = useState(false);

    const handleAddressChange = (index, value) => {
        const newAddresses = [...addresses];
        newAddresses[index] = value;
        setAddresses(newAddresses);
    };

    const handleAddAddress = () => {
        setAddresses([...addresses, '']);
    };

    const [baseFare, setBaseFare] = useState('');
    const [serviceFee, setServiceFee] = useState('');
    const [highDemandFee, setHighDemandFee] = useState('');
    const [splits, setSplits] = useState([]);


    function calculateSplit(baseFare, serviceFee, highDemandFee, distances, individualDistances) {

        const totalDistance = distances.reduce((a, b) => a + b, 0);
        const totalFare = Number(baseFare) + Number(serviceFee) + Number(highDemandFee);
        const feeSplit = (Number(serviceFee) + Number(highDemandFee)) / distances.length;

        const priceByKm = baseFare / totalDistance;

        const individualCosts = individualDistances.map(distance => distance * priceByKm);
        const individualSum = individualCosts.reduce((a, b) => a + b, 0);
        const totalSavings = individualSum - baseFare;

        const individualSavingsPercentage = individualCosts.map(cost => cost / individualSum);
        const individualSavingsAmount = individualSavingsPercentage.map(percentage => percentage * totalSavings);

        const split = individualCosts.map((cost, index) => cost - individualSavingsAmount[index] + feeSplit);
        const sumOfSplits = split.reduce((a, b) => a + b, 0);

        if (Math.abs(totalFare - sumOfSplits) > 0.01) {

            console.error('The sum of the splits does not equal the total fare');
        }

        return split;
    }

    async function getCarPoolDistances(addresses) {
        const distances = [];
        for (let i = 0; i < addresses.length - 1; i++) {
            // Convert the addresses to coordinates
            const originResponse = await fetch(`http://localhost:3000/api/googlemaps/geocode?address=${encodeURIComponent(addresses[i])}`);
            const destinationResponse = await fetch(`http://localhost:3000/api/googlemaps/geocode?address=${encodeURIComponent(addresses[i + 1])}`);

            const originData = await originResponse.json();
            const destinationData = await destinationResponse.json();

            // Check if the API responses contain results
            if (!originData.results[0] || !destinationData.results[0]) {
                console.error('Invalid address:', addresses[i], addresses[i + 1]);
                continue;
            }

            // Get the coordinates from the Geocoding API responses
            const origin = originData.results[0].geometry.location;
            const destination = destinationData.results[0].geometry.location;

            // Calculate the distance between the coordinates
            const distanceResponse = await fetch(`http://localhost:3000/api/googlemaps/distancematrix?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}`);
            const distanceData = await distanceResponse.json();
            const distance = distanceData.rows[0].elements[0].distance.value;
            distances.push(distance);
        }
        return distances;
    }

    async function getCarPoolIndividualDistances(addresses) {
        const distances = [];
        for (let i = 1; i <= addresses.length - 1; i++) {
            // Convert the addresses to coordinates, origin will always be the first one
            const originResponse = await fetch(`http://localhost:3000/api/googlemaps/geocode?address=${encodeURIComponent(addresses[0])}`);
            const destinationResponse = await fetch(`http://localhost:3000/api/googlemaps/geocode?address=${encodeURIComponent(addresses[i])}`);

            const originData = await originResponse.json();
            const destinationData = await destinationResponse.json();

            // Check if the API responses contain results
            if (!originData.results[0] || !destinationData.results[0]) {
                console.error('Invalid address:', addresses[0], addresses[i]);
                continue;
            }

            // Get the coordinates from the Geocoding API responses
            const origin = originData.results[0].geometry.location;
            const destination = destinationData.results[0].geometry.location;

            // Calculate the distance between the coordinates
            const distanceResponse = await fetch(`http://localhost:3000/api/googlemaps/distancematrix?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}`);
            const distanceData = await distanceResponse.json();
            const distance = distanceData.rows[0].elements[0].distance.value;

            distances.push(distance);
        }
        return distances;
    }

    const handleSubmit = async (event) => {
        setLoading(true);
        event.preventDefault();
        const distances = await getCarPoolDistances(addresses);
        const individualDistances = await getCarPoolIndividualDistances(addresses);
        const calculatedSplits = calculateSplit(baseFare, serviceFee, highDemandFee, distances.map(d => d / 1000), individualDistances.map(d => d / 1000));
        setSplits(calculatedSplits);
        setLoading(false);
    }


    return (
        <form onSubmit={handleSubmit}>
            <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">Car Pool Form</h2>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Route Addresses</h3>
                    {addresses.map((address, index) => (
                        <div key={index} className="space-y-2">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => handleAddressChange(index, e.target.value)}
                                placeholder="Enter Google Maps Coordinate"
                                className="p-2 w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
                            {index === addresses.length - 1 && (
                                <button onClick={handleAddAddress} className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-indigo-700 transition duration-150 ease-in-out">Add another address</button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Base Fare:</label>
                        <input
                            type="number"
                            value={baseFare}
                            onChange={(e) => setBaseFare(e.target.value)}
                            className="mt-1 p-2 w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Service Fee:</label>
                        <input
                            type="number"
                            value={serviceFee}
                            onChange={(e) => setServiceFee(e.target.value)}
                            className="mt-1 p-2 w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">High Demand Fee:</label>
                        <input
                            type="number"
                            value={highDemandFee}
                            onChange={(e) => setHighDemandFee(e.target.value)}
                            className="mt-1 p-2 w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                        />
                    </div>
                </div>
                {loading ? <p className="block text-sm font-medium text-gray-700">Calculating splits...</p> :
                    <button type="submit" onClick={handleSubmit} className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-indigo-700 transition duration-150 ease-in-out">Calculate Splits</button>
                }
                {splits.map((split, index) => (
                    <div key={index}>
                        <p className="block text-sm font-medium text-gray-700">Stop {index + 1}: {split.toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </ form>
    );
}