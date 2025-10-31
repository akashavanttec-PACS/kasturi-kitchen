import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export async function exportBookingsAsCSV(sections, mode='daily') {
  try {
    const rows = [];
    let totalCount = 0;

    // Loop over sections
    sections.forEach(section => {
      // Section header (company code)
      rows.push(`Company Code: ${section.title}`);

      // Table header
      rows.push('Employee Code,Name,Meal Date,Meal Time');

      // Data rows
      section.data.forEach(booking => {
        const row = [
          booking.employeeCode,
          `${booking.firstName} ${booking.lastName}`,
          booking.mealDate,
          booking.mealTime,
        ];
        rows.push(row.join(','));
        totalCount++;
      });

      rows.push(''); // Empty line for spacing between sections
    });

    // -----------------------------------------
    // 📊 Add MEAL COUNT SUMMARY SECTION
    // -----------------------------------------
    rows.push('');
    rows.push('TOTAL MEAL SUMMARY');
    rows.push('Company Code,Meal Count');

    // Calculate meal counts
    const mealData = sections.map(section => ({
      companyCode: section.title,
      mealCount: section.data.length,
    }));

    // Add each company meal count
    mealData.forEach(item => {
      rows.push(`${item.companyCode},${item.mealCount}`);
    });

    // Add final total row
    const total = mealData.reduce((sum, item) => sum + item.mealCount, 0);
    rows.push('');
    rows.push(`Total Bookings,${total}`);

    // -----------------------------------------
    // Write CSV file
    // -----------------------------------------
    const csvString = rows.join('\n');
    const fileName = `${mode}_bookings_${Date.now()}.csv`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, csvString, {
      encoding: 'utf8',
    });

    // -----------------------------------------
    // Share file
    // -----------------------------------------
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Share Bookings CSV',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      Alert.alert('Sharing Not Available', 'Your device does not support file sharing.');
    }
  } catch (error) {
    console.error('CSV export error:', error);
    Alert.alert('Error', 'Could not export CSV file.');
  }
}
