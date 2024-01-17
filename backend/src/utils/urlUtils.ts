// Check if the url is valid

export const isValidUrl = (url: string | string[]): boolean => {
    try {
        if (url instanceof Array) {
            return url.every((u) => {
                try {
                    new URL(u);
                    return true;
                } catch (error) {
                    return false;
                }
            });
        } else {
            new URL(url);
            return true;
        }
    } catch (error) {
        return false;
    }
};
