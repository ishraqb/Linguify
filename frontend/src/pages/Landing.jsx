import { useState, useEffect } from 'react'
import { Box, Container, Flex, Heading, Text, Badge } from '@chakra-ui/react'
import { getPopularSongs } from '../services/api'

const COVER_COLORS = ['#159a5b', '#3b6ef6', '#f5a623', '#e0245e', '#7c3aed', '#0891b2']

const SHELF_SONGS = [
    { id: 1, title: 'Bailando', artist: 'Enrique Iglesias' },
    { id: 2, title: 'Je Veux', artist: 'Zaz' },
    { id: 3, title: 'Lemon', artist: 'Kenshi Yonezu' },
    { id: 4, title: 'Vivir Mi Vida', artist: 'Marc Anthony' },
    { id: 5, title: 'La Vie en Rose', artist: 'Édith Piaf' },
]

function Button({ primary, children, ...rest }) {
    return (
        <Box
            as="button"
            bg={primary ? '#159a5b' : 'white'}
            color={primary ? 'white' : '#1a1d1e'}
            border={primary ? 'none' : '2px solid #1a1d1e'}
            borderRadius="8px"
            fontWeight="bold"
            px="4"
            py="2"
            cursor="pointer"
            _hover={{ background: primary ? '#0e7a47' : '#eeeeee' }}
            {...rest}
        >
            {children}
        </Box>
    )
}

function LyricPreviewCard() {
    const [saved, setSaved] = useState(false)
    return (
        <Box bg="white" borderRadius="12px" boxShadow="0 10px 28px rgba(20,40,30,0.15)" p="5" maxW="340px" w="100%" border="2px solid #1f1f1f">
            <Flex align="center" justify="space-between" mb="4">
                <Flex align="center" gap="3">
                    <Box boxSize="40px" borderRadius="6px" bg={COVER_COLORS[1]} />
                    <Box>
                        <Text fontWeight="800">Je Veux</Text>
                        <Text fontSize="13px" color="#5b6169">Zaz · French</Text>
                    </Box>
                </Flex>
                <div className="eq-bars"><span /><span /><span /></div>
            </Flex>

            <Box bg="#e9f7ee" borderRadius="6px" p="3" mb="2">
                <Text fontWeight="700" mb="1">Je ne veux pas travailler</Text>
                <Text fontSize="13px" color="#5b6169" fontStyle="italic">I don't want to work</Text>
            </Box>

            <Flex align="center" justify="space-between" mt="4">
                <Text fontSize="12px" color="#5b6169" fontWeight="700">3 of 5 lines reviewed</Text>
                <Button primary={saved} onClick={() => setSaved(!saved)}>
                    {saved ? '★ Saved' : '☆ Save word'}
                </Button>
            </Flex>
        </Box>
    )
}

function CoverTile({ song, index }) {
    return (
        <Box className="cover-tile" flex={{ base: '0 0 110px', md: '0 0 140px' }} cursor="pointer">
            <Box position="relative" borderRadius="8px" boxSize={{ base: '110px', md: '140px' }} mb="2" bg={COVER_COLORS[index % COVER_COLORS.length]} bgImage={song.coverUrl ? `url(${song.coverUrl})` : undefined} bgSize="cover" bgPosition="center">
                <Flex className="cover-play-btn" position="absolute" bottom="2" right="2" boxSize="36px" borderRadius="999px" bg="#159a5b" color="white" align="center" justify="center">
                    ▶
                </Flex>
            </Box>
            <Text fontWeight="700" fontSize="14px">{song.title}</Text>
            <Text fontSize="12px" color="#5b6169">{song.artist}</Text>
        </Box>
    )
}

function Landing() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
    const [popularSongs, setPopularSongs] = useState(SHELF_SONGS)

    // Pull real catalog songs with cover art; fall back to the static shelf on failure.
    useEffect(() => {
        getPopularSongs()
            .then((songs) => {
                if (Array.isArray(songs) && songs.length > 0) {
                    setPopularSongs(songs)
                }
            })
            .catch(() => {})
    }, [])

    return (
        <Box bg="#f3f8f5">
            <Flex align="center" justify="space-between" px={{ base: '4', md: '6' }} py="3">
                <Flex align="center" gap="10px">
                    <img src="/logo-mark.png" alt="Linguify logo" width="38" height="38" style={{ display: 'block', objectFit: 'contain' }} />
                    <Text fontSize={{ base: '22px', md: '26px' }} fontWeight="900" letterSpacing="-0.03em" color="#159a5b">Linguify</Text>
                </Flex>
                <Text as="a" href="#how-it-works" fontSize={{ base: '14px', md: '16px' }} fontWeight="600" color="#1f1f1f">How it works</Text>
            </Flex>

            <Box className="hero-gradient">
                <Container maxW="1100px" px="5" py={{ base: '8', md: '14' }}>
                    <Flex direction={{ base: 'column', md: 'row' }} align="center" gap="8">
                        <Box flex="1">
                            <Badge bg="#d4f3e0" color="#0f7a38" fontWeight="700" fontSize="13px" px="3" py="1" borderRadius="999px" mb="4">
                                Learn while you listen
                            </Badge>
                            <Heading fontSize={{ base: '32px', md: '44px' }} lineHeight="1.1" letterSpacing="-0.02em" mb="4">
                                Learn languages through the songs you love
                            </Heading>
                            <Text fontSize="18px" color="#4a5a52" lineHeight="1.6" mb="6" maxW="460px">
                                Pick a song from Spotify, read the lyrics line-by-line with translations,
                                save the words you want to remember, and review them as flashcards.
                            </Text>
                            <Button primary as="a" href={`${API_BASE_URL}/api/login`}>
                                ▶ Login with Spotify
                            </Button>
                        </Box>
                        <Flex flex="1" justify="center">
                            <LyricPreviewCard />
                        </Flex>
                    </Flex>
                </Container>
            </Box>

            <Box bg="white" borderTop="1px solid #e1e4e8">
                <Container maxW="1100px" px="5" py="8">
                    <Heading fontSize={{ base: '20px', md: '24px' }} mb="4">Popular right now</Heading>
                    <div className="shelf-row">
                        {popularSongs.map((song, i) => (
                            <CoverTile key={song.songId || song.id || i} song={song} index={i} />
                        ))}
                    </div>
                </Container>
            </Box>

            <Container maxW="1100px" px="5" py={{ base: '8', md: '12' }} id="how-it-works">
                <Box textAlign="center" mb="8">
                    <Heading fontSize={{ base: '24px', md: '30px' }} mb="6">How it works</Heading>
                </Box>
                <Flex direction={{ base: 'column', md: 'row' }} gap="5">
                    <Box flex="1" bg="white" borderRadius="18px" px="5" py="6" boxShadow="0 8px 24px rgba(31, 41, 51, 0.06)" textAlign="center">
                        <Heading fontSize="18px" mb="2">Pick a song</Heading>
                        <Text color="#5a6a62" lineHeight="1.5">Search Spotify or use a track you recently played.</Text>
                    </Box>
                    <Box flex="1" bg="white" borderRadius="18px" px="5" py="6" boxShadow="0 8px 24px rgba(31, 41, 51, 0.06)" textAlign="center">
                        <Heading fontSize="18px" mb="2">See translations</Heading>
                        <Text color="#5a6a62" lineHeight="1.5">Lyrics appear line-by-line with the meaning underneath.</Text>
                    </Box>
                    <Box flex="1" bg="white" borderRadius="18px" px="5" py="6" boxShadow="0 8px 24px rgba(31, 41, 51, 0.06)" textAlign="center">
                        <Heading fontSize="18px" mb="2">Save &amp; review</Heading>
                        <Text color="#5a6a62" lineHeight="1.5">Tap any word to save it, then study with flashcards.</Text>
                    </Box>
                </Flex>
            </Container>

            <Box bg="#e9f7ee">
                <Container maxW="1100px" px="5" py={{ base: '8', md: '12' }}>
                    <Heading fontSize={{ base: '22px', md: '26px' }} mb="6" textAlign="center">Built to make it stick</Heading>
                    <Flex direction={{ base: 'column', md: 'row' }} gap="6">
                        <Box flex="1" bg="white" borderRadius="12px" p="5" border="2px solid #1f1f1f">
                            <Heading fontSize="18px" mb="2">Streaks &amp; daily goals</Heading>
                            <Text color="#5b6169">Keep a listening streak going and earn XP for every lesson you finish.</Text>
                        </Box>
                        <Box flex="1" bg="white" borderRadius="12px" p="5" border="2px solid #1f1f1f">
                            <Heading fontSize="18px" mb="2">Flashcard review</Heading>
                            <Text color="#5b6169">Every word you save turns into a flashcard you can drill later.</Text>
                        </Box>
                    </Flex>
                </Container>
            </Box>
        </Box>
    )
}

export default Landing
