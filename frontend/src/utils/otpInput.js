export const focusNextInput = (target) => {
    const nextElementSibling = target.nextElementSibling;
    if (nextElementSibling) {
        nextElementSibling.focus();
    }
};

export const focusPrevInput = (target) => {
    const previousElementSibling = target.previousElementSibling;
    if (previousElementSibling) {
        previousElementSibling.focus();
    }
};
