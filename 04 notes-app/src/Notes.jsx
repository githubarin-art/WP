import React, { useState } from "react";
import './Notes.css';

function Notes() {
    let [notes, setNotes] = useState('');
    let [snotes, setSnotes] = useState([]);

    const ClickHandler = () => {
        if (notes.trim()) {
            setSnotes([...snotes, notes]); 
            setNotes(''); 
        }
    };

    const HandlesChange = (e) => {
        setNotes(e.target.value);
    };

    return (
        <>
            <div className="notes">
                <h1 id="first">Notes</h1>
                <textarea
                    id="notes"
                    name="notes"
                    rows="5"
                    value={notes}
                    onChange={HandlesChange}
                    placeholder="Type your notes here..."
                />
                <button onClick={ClickHandler} id="save">Save</button>
            </div>
            <div className="display">
                <h1 id="second">Display</h1>
                <ul>
                    {snotes.length > 0 ? snotes.map((note, index) => (
                        <li key={index}><p>{note}</p></li>
                    )) : <li><p>No notes to display.</p></li>}
                </ul>
            </div>
            <button id="edit">Edit</button>
        </>
    );
}

export default Notes;