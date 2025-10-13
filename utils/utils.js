export const formatTimeTo12Hour = (timeString) => {
    const [hour, minute, second] = timeString.split(':').map(Number);

    const date = new Date();
    date.setHours(hour, minute, second);

    const options = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };

    return date.toLocaleTimeString('en-US', options);
};

export const getISTDateString = () => {
    const now = new Date();

    // IST offset = +5:30 = 330 minutes
    const istOffset = 330;

    // Convert to IST by adjusting minutes
    const istTime = new Date(now.getTime() + istOffset * 60 * 1000);

    // Format to YYYY-MM-DD
    return istTime.toISOString().split("T")[0];
};

export const getCurrentISTTime = () => {
    const nowUTC = new Date();
    const utcMillis = nowUTC.getTime() + nowUTC.getTimezoneOffset() * 60 * 1000; // convert local to UTC
    const istOffsetMillis = 5.5 * 60 * 60 * 1000; // add 5:30 hours
    const istDate = new Date(utcMillis + istOffsetMillis);

    return istDate.toTimeString().split(" ")[0]; // "HH:MM:SS"
};