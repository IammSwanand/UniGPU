import { useState, useEffect, useMemo } from 'react';

export function useLocationData(selectedCountryIso, fetchEnabled = true) {
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Fetch countries on mount if enabled
    useEffect(() => {
        if (!fetchEnabled) return;

        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                const response = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
                const data = await response.json();
                if (!data.error) {
                    // Map to a consistent format { name, isoCode }
                    setCountries(data.data.map(c => ({ name: c.name, isoCode: c.Iso2 })));
                }
            } catch (error) {
                console.error("Failed to fetch countries", error);
            } finally {
                setLoadingCountries(false);
            }
        };

        fetchCountries();
    }, [fetchEnabled]);

    const selectedCountryName = useMemo(() => {
        if (!selectedCountryIso || !countries.length) return null;
        const country = countries.find(c => c.isoCode === selectedCountryIso);
        return country ? country.name : null;
    }, [selectedCountryIso, countries]);

    // Fetch cities when selected country name changes
    useEffect(() => {
        if (!selectedCountryName) {
            setCities([]);
            return;
        }

        const fetchCities = async () => {
            setLoadingCities(true);
            try {
                const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country: selectedCountryName })
                });
                const data = await response.json();
                if (!data.error) {
                    setCities(data.data.map(name => ({ name })));
                } else {
                    setCities([]);
                }
            } catch (error) {
                console.error("Failed to fetch cities", error);
                setCities([]);
            } finally {
                setLoadingCities(false);
            }
        };

        fetchCities();
    }, [selectedCountryName]);

    // Helper to get country name by ISO code
    const getCountryByCode = (isoCode) => {
        return countries.find(c => c.isoCode === isoCode);
    };

    return { countries, cities, loadingCountries, loadingCities, getCountryByCode };
}
