import { Box } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { useRobotsStore } from '../stores/robots/store';

/**
 * Компонент для отображения звездочки избранного
 */
export const FavoriteStarCell: React.FC<{ robotKey: string; isFavorite: boolean }> = ({
  robotKey,
  isFavorite,
}) => {
  const { toggleFavorite } = useRobotsStore();

  const handleClick = () => {
    toggleFavorite(robotKey);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      {isFavorite ? (
        <Star sx={{ color: '#ffc107', fontSize: '28px' }} />
      ) : (
        <StarBorder sx={{ fontSize: '28px', color: 'rgba(0, 0, 0, 0.54)' }} />
      )}
    </Box>
  );
};
