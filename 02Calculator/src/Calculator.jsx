import React from 'react';

const Calculator = ({ display, handleButtonClick, calculate, setInput, setDisplay }) => {
    const buttons = [
        { value: '7' }, { value: '8' }, { value: '9' }, { value: '-', className: 'operator-btn' },
        { value: '4' }, { value: '5' }, { value: '6' }, { value: '*', className: 'operator-btn' },
        { value: '1' }, { value: '2' }, { value: '3' }, { value: '/', className: 'operator-btn' },
        { value: '0' }, { value: '.' }, { value: '=', onClick: () => calculate('=') },
        { value: 'C', onClick: () => { setInput(''); setDisplay(''); }, className: 'operator-btn' },
        { value: '+', className: 'operator-btn' }
    ];

    return (
        <div>
            <h1>Calculator</h1>
            <div className="container">
                <input type="text" id='display' value={display} placeholder='' readOnly />
                {buttons.map((button, index) => (
                    <button
                        key={index}
                        onClick={() => button.onClick ? button.onClick() : handleButtonClick(button.value)}
                        className={button.className}
                    >
                        {button.value}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Calculator;