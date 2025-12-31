import Colors from './colors';

export const sharedHeaderStyles = {
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text.white,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.9,
  },
};

