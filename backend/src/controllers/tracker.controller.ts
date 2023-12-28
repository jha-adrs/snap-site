import logger from '@/config/logger';
import catchAsync from '@/utils/catchAsync';

const addLink = catchAsync(async (req, res) => {
	logger.info('Add link');
	return res.status(200).send({ message: 'added' });
});

export default {
	addLink,
};
