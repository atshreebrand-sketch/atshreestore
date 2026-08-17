import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://schsitbayzsqalkvnpbs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rHtZGmayQqlWsI-gJt-i8g_6_7LnaFz';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fallbackImage = 'https://images.unsplash.com/photo-1597983073493-88cd35cf93c4?auto=format&fit=crop&w=900&q=80';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    loadProducts();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('id,name,category,price,sale_price,image_url,description,sizes,colors,featured,active').eq('active', true).order('featured', { ascending: false }).order('id', { ascending: false });
    if (error) Alert.alert('ATSHREE', error.message);
    setProducts(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => products.filter(p => (category === 'All' || p.category === category) && `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);

  function addToCart(product) {
    setCart(current => {
      const found = current.find(x => x.id === product.id);
      return found ? current.map(x => x.id === product.id ? { ...x, qty: x.qty + 1 } : x) : [...current, { id: product.id, name: product.name, price: Number(product.sale_price ?? product.price), qty: 1 }];
    });
    setSelected(null);
  }

  async function signOut() { await supabase.auth.signOut(); setAccountOpen(false); }

  if (selected) return <Product product={selected} onBack={() => setSelected(null)} onAdd={() => addToCart(selected)} />;
  if (accountOpen) return <Account session={session} onBack={() => setAccountOpen(false)} onSignOut={signOut} />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>ATSHREE</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setAccountOpen(true)}><Text style={styles.icon}>ACCOUNT</Text></Pressable>
          <Pressable onPress={() => Alert.alert('Your Bag', cart.length ? `${cart.length} item(s) · ₹${total.toLocaleString('en-IN')}` : 'Your bag is empty')}><Text style={styles.icon}>BAG {cart.length ? `(${cart.length})` : ''}</Text></Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>MODERN INDIAN ETHNIC WEAR</Text>
          <Text style={styles.heroTitle}>Tradition,{`\n`}Reimagined.</Text>
          <Text style={styles.heroText}>Contemporary silhouettes, refined fabrics and effortless occasion dressing.</Text>
        </View>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search ATSHREE" placeholderTextColor="#8b8177" style={styles.search} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {['All','New In','Men','Women'].map(x => <Pressable key={x} onPress={() => setCategory(x)} style={[styles.filter, category === x && styles.filterActive]}><Text style={[styles.filterText, category === x && styles.filterTextActive]}>{x}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{category === 'All' ? 'New Arrivals' : category}</Text><Text style={styles.count}>{filtered.length} pieces</Text></View>
        {loading ? <ActivityIndicator size="large" style={{ marginTop: 40 }} /> : <FlatList data={filtered} scrollEnabled={false} numColumns={2} keyExtractor={x => String(x.id)} columnWrapperStyle={styles.grid} renderItem={({ item }) => <ProductCard product={item} onPress={() => setSelected(item)} />} />}
        {cart.length > 0 && <Pressable style={styles.cartBar} onPress={() => Alert.alert('Bag', `${cart.length} item(s) · ₹${total.toLocaleString('en-IN')}`, [{ text: 'Keep Shopping' }, { text: 'Checkout', onPress: () => Alert.alert('Checkout', 'Payment checkout will use the ATSHREE production gateway when credentials are enabled.') }])}><Text style={styles.cartBarText}>VIEW BAG · ₹{total.toLocaleString('en-IN')}</Text></Pressable>}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product, onPress }) {
  return <Pressable style={styles.card} onPress={onPress}><Image source={{ uri: product.image_url || fallbackImage }} style={styles.productImage} /><View style={styles.cardBody}><Text style={styles.category}>{product.category}</Text><Text style={styles.productName} numberOfLines={2}>{product.name}</Text><Text style={styles.price}>{product.sale_price ? `₹${Number(product.sale_price).toLocaleString('en-IN')}  ` : ''}<Text style={product.sale_price ? styles.strike : undefined}>{product.sale_price ? `₹${Number(product.price).toLocaleString('en-IN')}` : `₹${Number(product.price).toLocaleString('en-IN')}`}</Text></Text></View></Pressable>;
}

function Product({ product, onBack, onAdd }) {
  return <SafeAreaView style={styles.safe}><ScrollView><Pressable onPress={onBack} style={styles.back}><Text>‹ BACK</Text></Pressable><Image source={{ uri: product.image_url || fallbackImage }} style={styles.detailImage} /><View style={styles.detail}><Text style={styles.eyebrow}>{product.category}</Text><Text style={styles.detailTitle}>{product.name}</Text><Text style={styles.detailPrice}>{product.sale_price ? `₹${Number(product.sale_price).toLocaleString('en-IN')}  ` : ''}<Text style={product.sale_price ? styles.strike : undefined}>{product.sale_price ? `₹${Number(product.price).toLocaleString('en-IN')}` : `₹${Number(product.price).toLocaleString('en-IN')}`}</Text></Text><Text style={styles.description}>{product.description || 'A refined ATSHREE piece designed for modern Indian celebrations.'}</Text>{product.sizes?.length ? <Text style={styles.variant}>SIZES · {product.sizes.join(' · ')}</Text> : null}{product.colors?.length ? <Text style={styles.variant}>COLOURS · {product.colors.join(' · ')}</Text> : null}<Pressable style={styles.primary} onPress={onAdd}><Text style={styles.primaryText}>ADD TO BAG</Text></Pressable></View></ScrollView></SafeAreaView>;
}

function Account({ session, onBack, onSignOut }) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.account}><Pressable onPress={onBack}><Text>‹ BACK</Text></Pressable><Text style={styles.eyebrow}>ATSHREE</Text><Text style={styles.detailTitle}>My Account</Text>{session ? <><Text style={styles.accountEmail}>{session.user.email}</Text><Text style={styles.accountNote}>Your ATSHREE account uses the same secure Supabase account as the website.</Text><Pressable style={styles.primary} onPress={onSignOut}><Text style={styles.primaryText}>LOG OUT</Text></Pressable></> : <Text style={styles.accountNote}>Sign in on ATSHREE.com to access your account, saved addresses, rewards and orders.</Text>}</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#f8f7f4'}, header:{height:70,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#e6e2dc',backgroundColor:'#f8f7f4'}, logo:{fontSize:23,letterSpacing:4,fontWeight:'700',color:'#17130f'}, headerActions:{flexDirection:'row',gap:18}, icon:{fontSize:10,letterSpacing:1.2,color:'#17130f'}, content:{paddingBottom:110}, hero:{backgroundColor:'#ebe7df',paddingHorizontal:24,paddingVertical:55}, eyebrow:{fontSize:10,letterSpacing:2,color:'#756a60',marginBottom:12}, heroTitle:{fontSize:45,lineHeight:48,fontFamily:'Georgia',color:'#17130f'}, heroText:{fontSize:14,lineHeight:22,color:'#5d554e',marginTop:18,maxWidth:330}, search:{margin:20,borderWidth:1,borderColor:'#d5d0c8',padding:14,fontSize:14,backgroundColor:'#fff'}, filters:{paddingHorizontal:20,gap:8}, filter:{paddingHorizontal:17,paddingVertical:10,borderWidth:1,borderColor:'#d5d0c8'}, filterActive:{backgroundColor:'#17130f',borderColor:'#17130f'}, filterText:{fontSize:11,color:'#5d554e'}, filterTextActive:{color:'#fff'}, sectionHead:{paddingHorizontal:20,paddingTop:30,paddingBottom:16,flexDirection:'row',justifyContent:'space-between',alignItems:'baseline'}, sectionTitle:{fontFamily:'Georgia',fontSize:28}, count:{fontSize:11,color:'#756a60'}, grid:{paddingHorizontal:16,gap:10}, card:{backgroundColor:'#fff',flex:1,marginBottom:14}, productImage:{width:'100%',aspectRatio:.76,backgroundColor:'#eee'}, cardBody:{padding:12}, category:{fontSize:9,letterSpacing:1.4,color:'#8b8177',textTransform:'uppercase'}, productName:{fontSize:14,lineHeight:19,marginTop:5,color:'#17130f'}, price:{fontSize:13,marginTop:8,color:'#17130f'}, strike:{textDecorationLine:'line-through',color:'#999'}, cartBar:{position:'absolute',bottom:18,left:20,right:20,backgroundColor:'#17130f',padding:17,alignItems:'center'}, cartBarText:{color:'#fff',fontSize:11,letterSpacing:1.5}, back:{padding:20}, detailImage:{width:'100%',aspectRatio:.8,backgroundColor:'#eee'}, detail:{padding:24}, detailTitle:{fontFamily:'Georgia',fontSize:34,lineHeight:39,color:'#17130f'}, detailPrice:{fontSize:18,marginTop:14}, description:{fontSize:14,lineHeight:23,color:'#5d554e',marginTop:20}, variant:{fontSize:11,letterSpacing:1.2,color:'#5d554e',marginTop:20}, primary:{marginTop:28,backgroundColor:'#17130f',padding:17,alignItems:'center'}, primaryText:{color:'#fff',fontSize:11,letterSpacing:1.5}, account:{padding:24}, accountEmail:{fontSize:16,marginTop:20}, accountNote:{fontSize:14,lineHeight:22,color:'#5d554e',marginTop:14}
});
