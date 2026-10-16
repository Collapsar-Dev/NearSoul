/** Reference data seeded into every environment (interests, cities). Labels en + ru. */
export const INTERESTS: { id: string; category: string; en: string; ru: string }[] = [
  ['hiking', 'outdoors', 'Hiking', 'Походы'], ['cycling', 'outdoors', 'Cycling', 'Велосипед'], ['running', 'sport', 'Running', 'Бег'],
  ['yoga', 'sport', 'Yoga', 'Йога'], ['gym', 'sport', 'Gym', 'Спортзал'], ['swimming', 'sport', 'Swimming', 'Плавание'],
  ['climbing', 'sport', 'Climbing', 'Скалолазание'], ['football', 'sport', 'Football', 'Футбол'], ['tennis', 'sport', 'Tennis', 'Теннис'],
  ['dancing', 'sport', 'Dancing', 'Танцы'], ['travel', 'lifestyle', 'Travel', 'Путешествия'], ['cooking', 'lifestyle', 'Cooking', 'Готовка'],
  ['coffee', 'lifestyle', 'Coffee', 'Кофе'], ['wine', 'lifestyle', 'Wine', 'Вино'], ['food', 'lifestyle', 'Trying new food', 'Новая кухня'],
  ['pets', 'lifestyle', 'Pets', 'Животные'], ['gardening', 'lifestyle', 'Gardening', 'Садоводство'], ['volunteering', 'lifestyle', 'Volunteering', 'Волонтёрство'],
  ['music', 'culture', 'Live music', 'Живая музыка'], ['concerts', 'culture', 'Concerts', 'Концерты'], ['jazz', 'culture', 'Jazz', 'Джаз'],
  ['art', 'culture', 'Art', 'Искусство'], ['museums', 'culture', 'Museums', 'Музеи'], ['theatre', 'culture', 'Theatre', 'Театр'],
  ['cinema', 'culture', 'Cinema', 'Кино'], ['books', 'culture', 'Books', 'Книги'], ['photography', 'culture', 'Photography', 'Фотография'],
  ['writing', 'culture', 'Writing', 'Писательство'], ['podcasts', 'culture', 'Podcasts', 'Подкасты'], ['history', 'culture', 'History', 'История'],
  ['gaming', 'tech', 'Gaming', 'Игры'], ['tech', 'tech', 'Technology', 'Технологии'], ['science', 'tech', 'Science', 'Наука'],
  ['startups', 'tech', 'Startups', 'Стартапы'], ['languages', 'learning', 'Languages', 'Языки'], ['psychology', 'learning', 'Psychology', 'Психология'],
  ['meditation', 'learning', 'Meditation', 'Медитация'], ['philosophy', 'learning', 'Philosophy', 'Философия'], ['board_games', 'social', 'Board games', 'Настолки'],
  ['karaoke', 'social', 'Karaoke', 'Караоке'], ['festivals', 'social', 'Festivals', 'Фестивали'], ['nightlife', 'social', 'Nightlife', 'Ночная жизнь'],
].map(([id, category, en, ru]) => ({ id: id as string, category: category as string, en: en as string, ru: ru as string }));

export const CITIES: { id: string; en: string; ru: string; country: string; lat: number; lng: number }[] = [
  { id: 'amsterdam', en: 'Amsterdam', ru: 'Амстердам', country: 'NL', lat: 52.3676, lng: 4.9041 },
  { id: 'berlin', en: 'Berlin', ru: 'Берлин', country: 'DE', lat: 52.52, lng: 13.405 },
  { id: 'barcelona', en: 'Barcelona', ru: 'Барселона', country: 'ES', lat: 41.3874, lng: 2.1686 },
  { id: 'prague', en: 'Prague', ru: 'Прага', country: 'CZ', lat: 50.0755, lng: 14.4378 },
  { id: 'riga', en: 'Riga', ru: 'Рига', country: 'LV', lat: 56.9496, lng: 24.1052 },
  { id: 'tbilisi', en: 'Tbilisi', ru: 'Тбилиси', country: 'GE', lat: 41.7151, lng: 44.8271 },
  { id: 'yerevan', en: 'Yerevan', ru: 'Ереван', country: 'AM', lat: 40.1792, lng: 44.4991 },
  { id: 'dubai', en: 'Dubai', ru: 'Дубай', country: 'AE', lat: 25.2048, lng: 55.2708 },
];
