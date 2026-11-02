import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Platform, Button } from 'react-native';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { db } from './services/firebase';
import { Colors } from '../constants/theme';
import { exportBookingsAsCSV } from '../utils/exportToCSV';
import MealTable from '../components/MealTable';


const AdminPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false); // New state for monthly loading
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();

  // Fixed starting year = 2025 (launch year)
  const launchYear = 2025;

  // Dynamically create the list of years from 2025 → current year
  const years = Array.from({ length: currentYear - launchYear + 1 }, (_, i) => launchYear + i);

  const groupByCompany = (bookingsArray) => {
    const grouped = {};
    bookingsArray.forEach(booking => {
      const company = booking.companyCode || 'Unknown';
      if (!grouped[company]) grouped[company] = [];
      grouped[company].push(booking);
    });
    return grouped;
  };


const [selectedDate, setSelectedDate] = useState(new Date());
const currentDate = new Date();
const currentMonth = currentDate.getMonth();

	

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0];

        const bookingsRef = collection(db, "mealBookings");
        const q = query(bookingsRef, where("mealDate", "==", todayDateString));

        const querySnapshot = await getDocs(q);
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const groupedBookings = groupByCompany(bookingsData);
        const sectionedBookings = Object.keys(groupedBookings).map((companyCode) => ({
          title: companyCode,
          data: groupedBookings[companyCode],
        }));
        setBookings(sectionedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        Alert.alert("Error", "Could not fetch meal bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  //Monthly bookings
 const fetchMonthlyBookings = async () => {
    try {
      setLoadingMonthly(true);

      const year = selectedYear;
      const firstDay = new Date(year, selectedMonth, 1);
      const lastDay = new Date(year, selectedMonth + 1, 0, 23, 59, 59);
      console.log('Fetching bookings from', firstDay, 'to', lastDay);
      const startTimestamp = Timestamp.fromDate(firstDay);
      const endTimestamp = Timestamp.fromDate(lastDay);
      console.log('Start Timestamp:', startTimestamp);
      console.log('End Timestamp:', endTimestamp);
      const bookingsRef = collection(db, 'mealBookings');
      const q = query(
        bookingsRef,
        where('orderDate', '>=', startTimestamp),
        where('orderDate', '<=', endTimestamp)
      );

      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (bookingsData.length === 0) {
        Alert.alert('No Data', `No bookings found for ${months[selectedMonth]}.`);
        return;
      }

      const grouped = groupByCompany(bookingsData);
      const sectionedBookings = Object.keys(grouped).map((companyCode) => ({
        title: companyCode,
        data: grouped[companyCode],
      }));

      await exportBookingsAsCSV(sectionedBookings, 'monthly');
      Alert.alert('Success', `${months[selectedMonth]} report generated successfully!`);
    } catch (error) {
      console.error('Error fetching monthly bookings:', error);
      Alert.alert('Error', 'Could not fetch monthly bookings.');
    } finally {
      setLoadingMonthly(false);
    }
  };


  if (loading) {
    return <ActivityIndicator size="large" color={Colors.light.tint} style={styles.loader} />;
  }

  const renderHeader = () => (
    <View style={[styles.tableRow, styles.headerRow]}>
      <Text style={[styles.tableHeader, styles.snoCol]}>S.no</Text>
      <Text style={[styles.tableHeader, styles.nameCol]}>Name</Text>
      <Text style={[styles.tableHeader, styles.empCodeCol]}>Emp. Code</Text>
      <Text style={[styles.tableHeader, styles.dateCol]}>Date</Text>
      <Text style={[styles.tableHeader, styles.timeCol]}>Time</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Bookings</Text>
        <Text style={styles.count}>Total: {bookings?.reduce((sum, item) => sum + item?.data?.length, 0)}</Text>
      </View>

      {/* Scrollable Main Area */}
      <ScrollView style={styles.listContainer}>
        {bookings?.length > 0 ? (
          <>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => exportBookingsAsCSV(bookings)}
            >
              <Text style={styles.exportButtonText}>Get Daily Report</Text>
            </TouchableOpacity>

              {/* 🔹 Monthly Report Button */}
            <View style={styles.monthSelectorContainer}>
              <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedMonth}
                style={styles.monthPicker}
                onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              >
                {months.map((month, index) => (
                  <Picker.Item key={month} label={month} value={index} />
                ))}
              </Picker>
              </View>
                <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedYear}
                  style={styles.monthPicker}
                  onValueChange={(itemValue) => setSelectedYear(itemValue)}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>
              </View>

            </View>
            <View>
              <TouchableOpacity
                style={[styles.exportButton,{ marginBottom: 20 }, loadingMonthly ? styles.disabledButton : null]}
                onPress={fetchMonthlyBookings}
                disabled={loadingMonthly}
                activeOpacity={loadingMonthly ? 1 : 0.7}
              >
                 {/* {loadingMonthly && (
                     <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
                 )} */}
                <Text style={styles.exportButtonText}>
                  {loadingMonthly ? 'Generating...' : 'Get Monthly Report'}
                </Text>
              </TouchableOpacity>
            </View>



            {/* Table for each Company */}
            {bookings.map((section) => (
              <View key={section.title} style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Company Code: {section.title}</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableContainer}>
                    {/* Header */}
                    {renderHeader()}

                    {/* Data Rows */}
                    {section.data.map((item, index) => (
                      <View
                        style={[
                          styles.tableRow,
                          index % 2 === 0 ? styles.evenRow : styles.oddRow,
                        ]}
                        key={item.id}
                      >
                        <Text style={[styles.tableCell, styles.snoCol]}>{index + 1}</Text>
                        <Text style={[styles.tableCell, styles.nameCol]}>
                          {item.firstName} {item.lastName}
                        </Text>
                        <Text style={[styles.tableCell, styles.empCodeCol]}>
                          {item.employeeCode}
                        </Text>
                        <Text style={[styles.tableCell, styles.dateCol]}>
                          {item.mealDate}
                        </Text>
                        <Text style={[styles.tableCell, styles.timeCol]}>
                          {item.mealTime}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}

            {/* Summary Table */}
            <MealTable mealBooking={bookings} />
          </>
        ) : (
          <Text style={styles.noBookingsText}>No meals booked for today.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fb' },

  header: {
    backgroundColor: Colors.light.tint,
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  count: { fontSize: 18, color: '#f0f0f0', marginTop: 5 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { flex: 1, padding: 18 },

  exportButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    // marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  exportButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionContainer: {
    // backgroundColor: '#fff',
    borderRadius: 12,
    // padding: 14,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginBottom: 14,
    marginLeft: 6,
  },

  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14, // increased from 12 → 14
    paddingHorizontal: 14, // increased from 10 → 14
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    minHeight: 50, // ensures better row height
  },

  headerRow: {
    backgroundColor: '#f1f3f5',
    borderBottomWidth: 2,
    borderColor: '#d0d0d0',
  },

  tableHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  tableCell: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 6, // inner spacing for better text separation
  },

  snoCol: { flex: 0.8 },
  nameCol: { flex: 2.2, textAlign: 'left' },
  empCodeCol: { flex: 1.6 },
  dateCol: { flex: 1.5 },
  timeCol: { flex: 1.5 },

  evenRow: { backgroundColor: '#fafafa' },
  oddRow: { backgroundColor: '#fff' },

  noBookingsText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
    color: '#888',
  },
  monthSelectorContainer:{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  pickerWrapper: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 10,
  backgroundColor: '#fff',
  overflow: 'hidden', // helps border radius on Android
},
disabledButton: {
  backgroundColor: '#A9A9A9',
  opacity: 0.7,
},

monthPicker: {
  width: '100%',
  height: 50,
  color: '#000',
},
});

export default AdminPanel;
