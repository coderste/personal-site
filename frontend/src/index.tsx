import React, { useEffect, useState } from 'react'

import { createRoot } from 'react-dom/client'

const container = document.getElementById('root');
const root = createRoot(container!);

const App: React.FunctionComponent<{}> = () => {
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetch("http://localhost:9000/api", {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }).then(
            res => res.json()
        ).then(
            (result) => {
                console.log(result);
            },
            (err) => {
                setIsLoaded(true)
                setError(err)
            }
        )
    }, [])

    if (error) {
        return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
        return <div>Loading...</div>;
    } else {
        return (
            <div className='some-element'>
                <h1>Hello, to the frontend!</h1>
                <p>{items.map(item => (item.name))}</p>
            </div>
        )
    }
}

root.render(<App />)
