module.exports = {
startPayment: async ({ amount, method='pos-sim' } = {}) => {
// simulate generating payment id
return { success: true, paymentId: `PAY_${Date.now()}`, amount, method };
}
};